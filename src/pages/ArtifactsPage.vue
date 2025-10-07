<template>
  <q-page class="q-pa-md">
    <div class="page-header">
      <h2 class="q-mb-sm title">Artifacts</h2>
      <div class="subtitle-btn-row">
        <h5 class="q-mt-xs q-mb-lg subtitle">Discover preserved treasures in immersive 3D.</h5>
        <div class="artifact-btn">
          <span class="showing-text">Showing </span>

          <q-btn-dropdown
            outline
            color="black"
            :label="itemsToShow === 'all' ? 'All' : itemsToShow.toString()"
            size="sm"
            class="q-ml-sm artifact-btn-style"
          >
            <q-list>
              <q-item clickable v-close-popup @click="setItemsToShow('all')">
                <q-item-section>All</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(9)">
                <q-item-section>9</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(12)">
                <q-item-section>12</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setItemsToShow(18)">
                <q-item-section>18</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Filter Section -->
          <q-btn-dropdown
            outline
            color="black"
            label="Filter"
            icon="filter_list"
            size="sm"
            class="artifact-btn-style"
          >
            <q-list style="width: 40rem">
              <div class="row q-pa-md">
                <!-- Authors Column (Left) -->
                <div class="col q-pr-sm">
                  <div class="sub-font-3 q-mb-sm">Author</div>
                  <q-scroll-area style="height: 12rem; width: 12rem">
                    <q-list dense>
                      <q-item
                        v-for="authorOption in authorOptions"
                        :key="authorOption"
                        clickable
                        class="sub-font-2"
                        style="color: #000000"
                        @click="toggleAuthor(authorOption)"
                      >
                        <q-item-section avatar>
                          <q-checkbox
                            :model-value="selectedAuthors.has(authorOption)"
                            @update:model-value="toggleAuthor(authorOption)"
                          />
                        </q-item-section>
                        <q-item-section>{{ authorOption }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-scroll-area>
                  <!-- Clear Authors -->
                  <q-btn
                    v-if="selectedAuthors.size > 0"
                    flat
                    dense
                    color="primary"
                    label="Clear Author"
                    @click="clearAuthor"
                    class="q-mt-xs sub-font-3 full-width"
                  />
                </div>
                <!-- Years Column (Right) -->
                <div class="col">
                  <div class="sub-font-3 q-mb-sm">Year</div>
                  <q-scroll-area style="height: 12rem; width: 12rem">
                    <q-list dense>
                      <q-item
                        v-for="dateOption in dateOptions"
                        :key="dateOption"
                        clickable
                        class="sub-font-2"
                        style="color: #000000"
                        @click="toggleDate(dateOption)"
                      >
                        <q-item-section avatar>
                          <q-checkbox
                            :model-value="selectedDates.has(dateOption)"
                            @update:model-value="toggleDate(dateOption)"
                          />
                        </q-item-section>
                        <q-item-section>{{ dateOption }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-scroll-area>
                  <!-- Clear Years -->
                  <q-btn
                    v-if="selectedDates.size > 0"
                    flat
                    dense
                    color="primary"
                    label="Clear Year"
                    @click="clearDate"
                    class="q-mt-xs sub-font-3 full-width"
                  />
                </div>
                <!-- Categories Column -->
                <div class="col">
                  <div class="sub-font-3 q-mb-sm">Category</div>
                  <q-scroll-area style="height: 12rem; width: 12rem">
                    <q-list dense>
                      <q-item
                        v-for="categoryOption in categoryOptions"
                        :key="categoryOption"
                        clickable
                        class="sub-font-2"
                        style="color: #000000"
                        @click="toggleCategory(categoryOption)"
                      >
                        <q-item-section avatar>
                          <q-checkbox
                            :model-value="selectedCategories.has(categoryOption)"
                            @update:model-value="toggleCategory(categoryOption)"
                          />
                        </q-item-section>
                        <q-item-section>{{ categoryOption }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-scroll-area>
                  <!-- Clear Categories -->
                  <q-btn
                    v-if="
                      selectedCategories.size > 0 &&
                      !(selectedCategories.size === 1 && selectedCategories.has('All'))
                    "
                    flat
                    dense
                    color="primary"
                    label="Clear Category"
                    @click="clearCategories"
                    class="q-mt-xs sub-font-3 full-width"
                  />
                </div>
              </div>
              <q-separator />
              <!-- <q-item clickable v-close-popup @click="applyFilters">
                    <q-item-section class="flex items-center">
                      <div class="sub-font-3" style="color: #008000; font-weight: 500">
                        APPLY FILTERS
                      </div>
                    </q-item-section>
                  </q-item> -->
              <q-item clickable v-close-popup @click="clearFilters">
                <q-item-section class="flex items-center">
                  <div class="sub-font-3" style="color: #880000; font-weight: 500">
                    CLEAR ALL FILTERS
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Sort Section -->
          <q-btn-dropdown
            outline
            color="black"
            :label="`Sort by: ${sortLabel}`"
            icon="sort"
            size="sm"
            class="q-ml-md artifact-btn-style"
            dense
          >
            <q-list>
              <q-item
                v-for="option in allSortOptions"
                :key="option.label"
                clickable
                v-close-popup
                class="collection-sort-menu"
                @click="applySort(option)"
              >
                <q-item-section>{{ option.label }}</q-item-section>
                <q-item-section
                  side
                  v-if="
                    searchStore.sortBy === option.value.sortBy &&
                    searchStore.sortOrder === option.value.sortOrder
                  "
                >
                  <q-icon name="check" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            v-if="isAdmin"
            @click="showDialog = true"
            label="Add New"
            icon="add_circle"
            style="min-width: 9.375rem"
            class="add-new-btn"
            no-caps
            unelevated
          />

          <!-- Upload Dialog -->
          <UploadDialog
            v-model="showDialog"
            upload-type="artifacts"
            accept=".glb"
            :show-camera="false"
            :uploading="uploading"
            :upload-progress="uploadProgress"
            @file-selected="onFileSelected"
            @file-dropped="onFileDropped"
            @upload-click="handleUpload"
            @cancel-click="handleCancel"
          />

          <div>
            <!-- Category Section -->
            <div class="row q-mt-md q-gutter-sm">
              <q-btn
                v-for="categoryOption in categoryOptions"
                :key="categoryOption"
                :label="categoryOption"
                class="btn-1"
                :class="{ active: selectedCategories.has(categoryOption) }"
                unelevated
                @click="toggleCategory(categoryOption)"
              />
            </div>
          </div>

          <!-- <q-dialog v-model="showDialog" persistent>
            <q-card class="add-documentarti-card">
              <q-card-section
                class="box-upload-docuarti"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onFileDrop"
                :class="{ 'drag-over': isDragging }"
              >
                <q-img
                  src="/img/drag-drop-icon.png"
                  alt="Upload-Artifacts"
                  class="upload-icon-docu"
                />
                <div
                  v-if="!selectedFile"
                  class="sub-font-3 text-center"
                  style="font-size: 14px; font-weight: 200"
                >
                  <div class="sub-font-3 text-center" style="font-size: 18px; font-weight: 200">
                    DRAG and DROP files
                  </div>
                  or
                  <a href="#" @click.prevent="triggerFileInput"><strong>Browse Files</strong></a> on
                  your computer
                </div>
                <div v-else class="documentarti-preview text-center">
                  <q-img src="/img/document-icon.png" alt="Artifacts" class="document-icon" />
                  <div class="selected-documentarti-name q-mt-md">
                    {{ selectedFile.name }}
                  </div>
                  // Upload progress bar
                  <q-linear-progress
                    v-if="uploading"
                    :value="uploadProgress / 100"
                    color="primary"
                    class="q-mt-md full-width"
                  />
                </div>
                <input
                  type="file"
                  ref="fileInput"
                  accept=".glb"
                  style="display: none"
                  @change="handleFileChange"
                />
              </q-card-section>

              <q-card-actions class="row q-ml-lg justify-between items-center">
                <div></div>
                <q-btn
                  v-if="!uploading"
                  label="Upload"
                  class="q-ml-xl q-mt-sm btn-save"
                  @click="handleUpload"
                  no-caps
                />

                <q-spinner v-else color="primary" size="2em" class="q-ml-xl q-mt-sm" />

                <q-btn
                  flat
                  label="Cancel"
                  class="q-mt-sm sub-font-2"
                  style="color: #000000"
                  v-close-popup
                  no-caps
                  @click="handleCancel"
                />
              </q-card-actions>
            </q-card>
          </q-dialog> -->
        </div>
      </div>
    </div>

    <!-- Three Artifacts per Row Grid -->
    <div class="artifacts-grid">
      <div
        v-for="(model, i) in searchStore.query
          ? searchStore.searchedModels
          : modelStore.filteredModels"
        :key="i"
        class="artifact-card-wrapper"
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
            <div class="artifact-title-icon-row q-mt-sm">
              <router-link
                :to="{ name: 'view-artifact', params: { id: model.id } }"
                class="artifact-title-link"
                @click="logClick(model.id, 'artifact', 'view_artifact')"
              >
                <div class="text-subtitle2 artifact-title">
                  {{ model.metadata?.title || model.file_name }}
                </div>
              </router-link>
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
                    @click.stop="isAdmin ? null : toggleFavorite(model, 'artifact')"
                  />
                  <span class="count-text">{{ modelStore.starCounts[model.id] || 0 }}</span>
                </div>

                <!-- Bookmark Icon -->
                <q-icon
                  v-if="!isAdmin"
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

    <!-- Show All -->
    <div v-if="hasMoreItems" class="text-center q-mt-lg">
      <q-btn
        outline
        color="primary"
        :label="`Show All ${sortedModels.length} Items`"
        @click="setItemsToShow('all')"
      />
    </div>

    <!-- Empty State -->
    <div v-if="displayedModels.length === 0 && !loading" class="text-center q-mt-xl">
      <q-icon name="inventory_2" size="4rem" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No artifacts found</div>
      <div class="text-body2 text-grey-5">Try adjusting your filters or search terms</div>
    </div>

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
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
          notifyDialogMessage
        }}</q-card-section>
        <q-card-actions>
          <q-btn flat label="Close" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />

    <div class="pagination-controls justify-center">
      <q-btn
        flat
        round
        icon="chevron_left"
        :disable="modelsCurrentPage === 1"
        @click="prevModelsPage"
        class="pagination-btn"
        size="sm"
      />

      <span class="pagination-numbers">
        <span
          v-for="page in modelsTotalPages"
          :key="page"
          @click="goToModelsPage(page)"
          :class="['page-number', { active: page === modelsCurrentPage }]"
        >
          {{ page }}
        </span>
      </span>

      <q-btn
        flat
        round
        icon="chevron_right"
        :disable="modelsCurrentPage === modelsTotalPages"
        @click="nextModelsPage"
        class="pagination-btn"
        size="sm"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useModelStore } from 'stores/modelStore'
import { useSearchStore } from 'stores/searchStore'
import { useUserStore } from 'stores/user'
import { supabase } from 'boot/supabase'
import { uploadFileToR2 } from 'boot/r2'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { allSortOptions } from 'src/stores/searchStore'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import UploadDialog from 'src/components/UploadDialog.vue'
import '@google/model-viewer'

const router = useRouter()
const $q = useQuasar()
const modelStore = useModelStore()
const searchStore = useSearchStore()
const userStore = useUserStore()

// Reactive data
// const searchQuery = ref('')
// const categoryFilter = ref(null)
// const authorFilter = ref(null)
// const dateFilter = ref(null)
// const sortOption = ref('Newest')
// const sortOptions = ['Newest', 'Oldest', 'Title A-Z', 'Title Z-A']

const sortLabel = computed(() => searchStore.getSortLabel(allSortOptions))
const itemsToShow = ref('all')

// Filter options - will be populated from data
const categoryOptions = ref([])
const authorOptions = ref([])
const dateOptions = ref([])
const selectedCategories = ref(new Set(['All']))
const selectedAuthors = ref(new Set())
const selectedDates = ref(new Set())

// Dialog for upload pop up
const showDialog = ref(false)
const selectedFile = ref(null)
// const fileInput = ref(null)
// const isDragging = ref(false)
const dialog = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)

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

// Computed properties
// const filteredModels = computed(() => {
//   return searchStore.query ? searchStore.searchedModels : modelStore.filteredModels
// })

if (userStore.profile.role === undefined) {
  userStore.fetchProfile()
}

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')
const userType = computed(() => userStore.profile.user_type || 'Unknown')

function startRotate(e) {
  const el = e.target
  el.autoRotate = true
  el.rotationPerSecond = '10deg'
  el.autoRotateDelay = 0
}

function stopRotate(e) {
  const el = e.target
  el.autoRotate = false
  el.cameraOrbit = '0deg 75deg 105%' // Reset back to original orientation
}

// const sortedModels = computed(() => {
//   const models = [...filteredModels.value]

//   return models.sort((a, b) => {
//     let aValue, bValue

//     switch (sortOption.value) {
//       case 'Newest':
//         aValue = new Date(a.uploaded_at || a.created_at || 0)
//         bValue = new Date(b.uploaded_at || b.created_at || 0)
//         return bValue - aValue
//       case 'Oldest':
//         aValue = new Date(a.uploaded_at || a.created_at || 0)
//         bValue = new Date(b.uploaded_at || b.created_at || 0)
//         return aValue - bValue
//       case 'Title A-Z':
//         aValue = (a.metadata?.title || a.file_name).toLowerCase()
//         bValue = (b.metadata?.title || b.file_name).toLowerCase()
//         return aValue.localeCompare(bValue)
//       case 'Title Z-A':
//         aValue = (a.metadata?.title || a.file_name).toLowerCase()
//         bValue = (b.metadata?.title || b.file_name).toLowerCase()
//         return bValue.localeCompare(aValue)
//       default:
//         return 0
//     }
//   })
// })

// const displayedModels = computed(() => {
//   if (itemsToShow.value === 'all') {
//     return sortedModels.value
//   }
//   return sortedModels.value.slice(0, itemsToShow.value)
// })

// const hasMoreItems = computed(() => {
//   return itemsToShow.value !== 'all' && sortedModels.value.length > itemsToShow.value
// })

// // Methods
// const setItemsToShow = (value) => {
//   itemsToShow.value = value
// }

// Toggle favorite icon
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

    const isAdding = existing.length === 0

    if (!isAdding) {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', model.id)
        .eq('item_type', itemType)

      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: model.id,
        item_type: itemType,
      })

      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Sync starred status across all lists
    const updateStarred = (list) => {
      if (!Array.isArray(list)) return
      const target = list.find((m) => m.id === model.id)
      if (target) target.starred = isAdding
    }

    updateStarred(searchStore.searchedModels)
    updateStarred(modelStore.filteredModels)
    updateStarred(modelStore.models) // master list

    // Update star count
    const { data: starData } = await supabase
      .from('artifacts_star_count')
      .select('star_count')
      .eq('item_id', model.id)
      .maybeSingle()

    const starCount = starData?.star_count ?? 0
    modelStore.updateStarCount(model.id, starCount)
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

// Collection dialog methods
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

      model.bookmarked = false
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

async function logClick(itemId, itemType, action) {
  if (!isAdmin.value) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    const model = await modelStore.getModelById(itemId)

    if (authError || !userId) {
      console.error('Auth error logging click:', authError)
      return
    }

    try {
      const { error } = await supabase.from('user_activity_log').insert({
        user_id: userId,
        item_id: itemId,
        title: model.title || 'Untitled',
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
}

// Fetch all artifacts from Supabase
const fetchAllArtifacts = async () => {
  try {
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (!error) {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id

      // Fetch Favorites collection items
      const { data: favoritesCollection, error: favError } = await supabase
        .from('collections')
        .select('collection_id')
        .eq('user_id', userId)
        .eq('collection_name', 'Favorites')
        .maybeSingle()

      if (favError) {
        console.error('Error fetching favorite items:', favError)
      }

      let favoriteIds = []
      let bookmarkedIds = []

      if (favoritesCollection) {
        const { data: favItems, error: favItemsError } = await supabase
          .from('collection_items')
          .select('item_id')
          .eq('collection_id', favoritesCollection.collection_id)
          .eq('item_type', 'artifact')

        if (!favItemsError) {
          favoriteIds = favItems.map((i) => i.item_id)
        }
      }

      // Get ALL user collections (for bookmarked check)
      const { data: allUserCollections, error: allCollError } = await supabase
        .from('collections')
        .select('collection_id, collection_name')
        .eq('user_id', userId)

      // Get bookmarked document IDs (from non-Favorites collections)
      if (allUserCollections && !allCollError) {
        const nonFavoritesCollections = allUserCollections.filter(
          (col) => col.collection_name !== 'Favorites',
        )

        if (nonFavoritesCollections.length > 0) {
          const collectionIds = nonFavoritesCollections.map((col) => col.collection_id)

          const { data: bookmarkedItems, error: bookmarkError } = await supabase
            .from('collection_items')
            .select('item_id')
            .in('collection_id', collectionIds)
            .eq('item_type', 'artifact')

          if (!bookmarkError && bookmarkedItems) {
            bookmarkedIds = [...new Set(bookmarkedItems.map((i) => i.item_id))]
          }
        }
      }

      // Add some mock data for demonstration compatibility
      const enhancedModels = data.map((model) => ({
        ...model,
        bookmarked: bookmarkedIds.includes(model.id),
        starred: favoriteIds.includes(model.id),
      }))

      modelStore.setModels(enhancedModels)

      // Extract unique values for filters
      const authors = new Set()
      const years = new Set()
      const categories = new Set()

      data.forEach((model) => {
        if (model.metadata?.author) {
          const authorList = model.metadata.author.split(',').map((a) => a.trim())
          authorList.forEach((a) => authors.add(a))
        }

        if (model.metadata?.date) years.add(model.metadata.date?.slice(0, 4))

        if (Array.isArray(model.metadata?.categories)) {
          model.metadata.categories.forEach((cat) => categories.add(cat))
        }
      })

      authorOptions.value = Array.from(authors)
      categoryOptions.value = Array.from(categories)
      dateOptions.value = Array.from(years).sort((a, b) => b - a)
    }
  } catch (error) {
    console.error('Error loading artifacts:', error)
  }
}

// // Watch for filter changes
// watch(
//   () => modelStore.filteredModels,
//   (mods) => {
//     const authors = new Set()
//     const years = new Set()
//     const categories = new Set()

//     mods.forEach((mod) => {
//       const meta = mod.metadata || {}

//       if (meta.author) {
//         meta.author.split(',').forEach((a) => authors.add(a.trim()))
//       }

//       if (meta.date) {
//         const year = meta.date.slice(0, 4)
//         years.add(year)
//       }

//       if (Array.isArray(meta.categories)) {
//         meta.categories.forEach((cat) => categories.add(cat))
//       }
//     })

//     authorOptions.value = [...authors].sort()
//     categoryOptions.value = [...categories].sort()
//     dateOptions.value = [...years].sort((a, b) => b - a)
//   },
//   { immediate: true },
// )

// // Watch for filter changes and reset items to show
// watch([categoryFilter, authorFilter, dateFilter], () => {
//   if (itemsToShow.value !== 'all') {
//     itemsToShow.value = 'all'
//   }
// })

// Initialize
onMounted(async () => {
  loading.value = true
  try {
    if (!searchStore.query) {
      await fetchAllArtifacts()
    }

    await modelStore.fetchViewCounts()
    await modelStore.fetchStarCounts()

    // Apply sort if there’s an active option
    if (searchStore.sortBy) {
      searchStore.sortResults(searchStore.searchedModels)
    }

    console.log('Applied sorting:', searchStore.sortBy, searchStore.sortOrder)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  searchStore.clear()
})

// Upload
const metadata = ref({
  file_name: '',
  file_url: '',
  title: '',
  author: '',
  date: '',
  summary: '',
  keywords: [],
  categories: [],
})

// function triggerFileInput() {
//   fileInput.value?.click()
// }

// function handleFileChange(event) {
//   const file = event.target.files[0]
//   if (file) {
//     selectedFile.value = file
//   } else {
//     selectedFile.value = null
//   }
// }

// function onDragOver() {
//   isDragging.value = true
// }

// function onDragLeave() {
//   isDragging.value = false
// }

// function onFileDrop(e) {
//   isDragging.value = false
//   const files = e.dataTransfer.files
//   console.log(files)
//   if (files.length > 0 && files[0].name.endsWith('.glb')) {
//     selectedFile.value = files[0]
//   } else {
//     alert('Only GLB files are allowed.')
//   }
// }

// File selection handlers
function onFileSelected(file) {
  selectedFile.value = file
}

function onFileDropped(file) {
  if (file && file.name.endsWith('.glb')) {
    selectedFile.value = file
  } else {
    alert('Only GLB files are allowed.')
    selectedFile.value = null
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^\w.-]/g, '_') // Replace all non-alphanumeric/underscore/dot/dash characters with _
}

// ADDED: Compress GLB
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// const loader = new GLTFLoader()

// // Setup DRACO loader
// const dracoLoader = new DRACOLoader()
// dracoLoader.setDecoderPath('/draco/') // Ensure you serve decoder files from this path
// loader.setDRACOLoader(dracoLoader)

// async function compressGLB(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()
//     reader.onload = async (e) => {
//       const arrayBuffer = e.target.result

//       const loader = new GLTFLoader()

//       // DRACO decoding setup
//       const dracoLoader = new DRACOLoader()
//       dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/') // CDN
//       loader.setDRACOLoader(dracoLoader)

//       loader.parse(
//         arrayBuffer,
//         '',
//         (gltf) => {
//           const exporter = new GLTFExporter()

//           exporter.parse(
//             gltf.scene,
//             (result) => {
//               const blob = new Blob([result], { type: 'model/gltf-binary' })
//               resolve(blob)
//             },
//             {
//               binary: true,
//               embedImages: true,
//               animations: gltf.animations,
//               truncateDrawRange: true,
//               includeCustomExtensions: true,
//               dracoOptions: {
//                 compressionLevel: 10,
//               },
//             },
//           )
//         },
//         (error) => {
//           reject(error)
//         },
//       )
//     }

//     reader.onerror = reject
//     reader.readAsArrayBuffer(file)
//   })
// }

// const handleUpload = async () => {
//   const originalFile = selectedFile.value
//   if (!originalFile) return

//   const fileName = sanitizeFileName(originalFile.name)
//   uploading.value = true
//   uploadProgress.value = 0

//   if (!fileName.endsWith('.glb')) {
//     alert('Only .glb files are allowed.')
//     uploading.value = false
//     return
//   }

//   loading.value = true

//   try {
//     const alreadyExists = await fileExists(fileName)
//     if (alreadyExists) {
//       alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
//       uploading.value = false
//       loading.value = false
//       return
//     }

//     console.log(`Starting GLB compression for: ${fileName}`)
//     console.log(`GLB Original size: ${(originalFile.size / 1024).toFixed(2)} KB`)

//     const compressedFile = await compressGLB(originalFile)

//     console.log(`GLB Compression complete: ${fileName}`)
//     console.log(`GLB Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`)

//     const saved = (originalFile.size - compressedFile.size) / 1024
//     console.log(`GLB compression saved: ${saved.toFixed(2)} KB`)

//     // Progress bar simulation
//     const progressInterval = setInterval(() => {
//       if (uploadProgress.value < 90) {
//         uploadProgress.value += 1
//       }
//     }, 200)

//     const { error: uploadError } = await supabase.storage
//       .from('artifacts')
//       .upload(fileName, compressedFile, {
//         cacheControl: '3600',
//         upsert: true,
//         contentType: 'model/gltf-binary',
//       })

//     clearInterval(progressInterval)
//     uploadProgress.value = 100

//     if (uploadError) {
//       console.error('Upload error:', uploadError)
//       alert('Upload failed.')
//       uploading.value = false
//       loading.value = false
//       return
//     }

//     const { data: urlData } = supabase.storage.from('artifacts').getPublicUrl(fileName)
//     const fileUrl = urlData.publicUrl

//     const insertData = {
//       file_name: fileName,
//       file_url: fileUrl,
//       uploaded_at: new Date(),
//       updated_at: new Date(),
//     }

//     const { error: dbError } = await supabase.from('artifacts_metadata').insert([insertData])
//     if (dbError) {
//       console.error('Supabase insert error:', dbError)
//       alert('Upload succeeded but metadata failed to save.')
//     } else {
//       console.log('Upload Success')
//     }

//     setTimeout(() => {
//       uploading.value = false
//       uploadProgress.value = 0
//     }, 1000)

//     metadata.value = {
//       file_name: fileName,
//       file_url: fileUrl,
//       title: '',
//       author: '',
//       date: '',
//       summary: '',
//       keywords: [],
//       categories: [],
//     }

//     dialog.value = true
//   } catch (err) {
//     console.error('Upload failed:', err)
//     alert('Upload failed. See console for details.')
//   } finally {
//     loading.value = false
//   }
// }

// const handleUpload = async () => {
//   const file = selectedFile.value
//   const fileName = sanitizeFileName(file.name)
//   uploading.value = true
//   uploadProgress.value = 0

//   if (!file || !fileName.endsWith('.glb')) {
//     alert('Only .glb files are allowed.')
//     return
//   }

//   loading.value = true

//   try {
//     const alreadyExists = await fileExists(fileName)

//     if (alreadyExists) {
//       alert(`A file named "${fileName}" already exists. Please rename or choose another file.`)
//       return
//     }

//     // Fake progress bar animation
//     const progressInterval = setInterval(() => {
//       if (uploadProgress.value < 90) {
//         uploadProgress.value += 1
//       }
//     }, 200)

//     // Upload to R2 Storage
//     const { uploadError } = await uploadFileToR2(file, 'artifacts', fileName)

//     clearInterval(progressInterval)
//     uploadProgress.value = 100

//     const fileUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/artifacts/${encodeURIComponent(fileName)}`

//     if (uploadError) {
//       console.error('Upload error:', uploadError)
//       alert('Upload failed.')
//       return
//     }

//     // Save metadata
//     const insertData = {
//       file_name: fileName,
//       file_url: fileUrl,
//       uploaded_at: new Date(),
//       updated_at: new Date(),
//     }

//     const { error: dbError } = await supabase.from('artifacts_metadata').insert([insertData])
//     if (dbError) {
//       console.error('Supabase insert error:', dbError)
//       alert('Upload succeeded but metadata failed to save.')
//       return
//     } else {
//       console.log('Upload Success')
//     }

//     setTimeout(() => {
//       uploading.value = false
//       uploadProgress.value = 0
//     }, 1000)

//     // Open metadata confirmation dialog
//     metadata.value = {
//       file_name: fileName,
//       file_url: fileUrl,
//       title: '',
//       author: '',
//       date: '',
//       summary: '',
//       keywords: [],
//       categories: [],
//     }

//     dialog.value = true
//   } catch (err) {
//     console.error('Upload failed:', err)
//     alert('Upload failed. See console for details.')
//   } finally {
//     loading.value = false
//   }
// }

let currentArtifactData = ref(null)

const handleUpload = async () => {
  const file = selectedFile.value
  const fileName = sanitizeFileName(file.name)
  uploading.value = true
  uploadProgress.value = 0

  if (!file || !fileName.endsWith('.glb')) {
    $q.notify({ type: 'negative', message: 'Only .glb files are allowed.' })
    uploading.value = false
    return
  }

  loading.value = true

  try {
    const alreadyExists = await fileExists(fileName)
    if (alreadyExists) {
      $q.notify({
        type: 'negative',
        message: `A file named "${fileName}" already exists. Please rename or choose another file.`,
      })
      uploading.value = false
      return
    }

    // Fake progress bar animation
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 1
      }
    }, 200)

    // Upload to R2 Storage
    const { uploadError } = await uploadFileToR2(file, 'artifacts', fileName)
    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Upload failed.')
      uploading.value = false
      return
    }

    const fileUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/artifacts/${encodeURIComponent(fileName)}`

    // Save initial metadata (without user-filled metadata yet)
    const insertData = {
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date(),
      metadata: null,
      donated_by: null,
      updated_at: null,
      data_source: null,
      search_text: null,
      date_received: null,
      related_links: null,
    }

    const { data: insertedData, error: dbError } = await supabase
      .from('artifacts_metadata')
      .insert([insertData])
      .select()

    if (dbError || !insertedData || insertedData.length === 0) {
      console.error('Supabase insert error:', dbError)
      alert('Upload succeeded but metadata failed to save.')
      uploading.value = false
      return
    }

    const item = insertedData[0]
    console.log('Upload success', item)

    currentArtifactData.value = { ...item }
    metadata.value = { ...item }

    const changes = {
      id: { old: null, new: item.id },
      file_name: { old: null, new: insertData.file_name },
      file_url: { old: null, new: insertData.file_url },
      uploaded_at: { old: null, new: insertData.uploaded_at },
    }

    await logItemHistory({
      itemId: item.id,
      itemType: 'artifact',
      action: 'upload',
      oldData: null,
      newData: item,
      changes,
    })

    // Reset progress after a short delay
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
    }, 1000)

    // Store inserted item in metadata.value for later editing
    metadata.value = { ...item }

    // Open metadata confirmation dialog
    dialog.value = true
  } catch (err) {
    console.error('Upload failed:', err)
    alert('Upload failed. See console for details.')
    uploading.value = false
  } finally {
    loading.value = false
  }
}

async function fileExists(fileName) {
  const { data, error } = await supabase
    .from('artifacts_metadata')
    .select('file_name')
    .eq('file_name', fileName)

  if (!data || data.length === 0) return false

  if (error) {
    console.error('Error checking file existence:', error)
    return false
  }

  return !!data
}

// async function saveMetadata(updatedMetadata) {
//   console.log('Saving metadata: ', updatedMetadata)
//   try {
//     const { error } = await supabase
//       .from('artifacts_metadata')
//       .update({
//         metadata: {
//           title: updatedMetadata.title,
//           author: updatedMetadata.author,
//           date: updatedMetadata.date,
//           summary: updatedMetadata.summary,
//           keywords: updatedMetadata.keywords,
//           categories: updatedMetadata.categories,
//         },
//         updated_at: new Date(),
//       })
//       .eq('file_name', metadata.value.file_name)

//     if (error) {
//       console.error('Failed to update metadata:', error)
//       alert('Failed to update metadata.')
//     } else {
//       alert('Metadata saved successfully!')
//       dialog.value = false
//       router.push({ name: 'admin-home' })
//     }
//   } catch (err) {
//     console.error('Error saving metadata:', err)
//     alert('Unexpected error occurred.')
//   }
// }

function normalizeValue(key, value) {
  if (value === '') return null

  if (Array.isArray(value)) {
    return value
  }

  return value
}

function normalizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const normalized = {}
  for (const key in obj) {
    normalized[key] = normalizeValue(key, obj[key])
  }
  return normalized
}

async function saveMetadata(updatedMetadata) {
  try {
    const oldData = {
      ...currentArtifactData.value,
    }

    const now = new Date()

    const updateData = {
      ...oldData,
      metadata: normalizeObject({
        title: updatedMetadata.title,
        author: updatedMetadata.author,
        date: updatedMetadata.date,
        summary: updatedMetadata.summary,
        keywords: updatedMetadata.keywords,
        categories: updatedMetadata.categories,
      }),
      updated_at: now,
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('artifacts_metadata')
      .update(updateData)
      .eq('id', metadata.value.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update metadata:', updateError)
      showNotifyDialog('Error', 'Failed to save changes.')
      return
    }

    const newData = {
      ...updatedData,
    }

    const changes = getChanges(oldData, newData)

    await logItemHistory({
      itemId: metadata.value.id,
      itemType: 'artifact',
      action: 'update',
      oldData,
      newData,
      changes,
    })

    currentArtifactData.value = updatedData
    showNotifyDialog('Notice', 'Metadata saved successfully!')
    dialog.value = false
    router.push('/artifacts')
  } catch (err) {
    console.error('Error saving metadata:', err)
    alert('Unexpected error occurred.')
  }
}

// getChanges function
function getChanges(oldData = {}, newData = {}) {
  const changes = {}

  if (newData.metadata) {
    const metadataChanges = {}
    for (const key in newData.metadata) {
      const oldValue = oldData.metadata?.[key] ?? null
      const newValue = newData.metadata?.[key] ?? null
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        metadataChanges[key] = { old: oldValue, new: newValue }
      }
    }
    if (Object.keys(metadataChanges).length > 0) {
      changes.metadata = metadataChanges
    }
  }

  for (const key of Object.keys(newData)) {
    if (key === 'metadata') continue
    const oldValue = oldData[key] ?? null
    const newValue = newData[key] ?? null
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue }
    }
  }

  return changes
}

async function handleCancelMetadata(cancelledData) {
  try {
    const itemId = cancelledData.id

    const { error: deleteItemError } = await supabase
      .from('artifacts_metadata')
      .delete()
      .eq('id', itemId)

    if (deleteItemError) {
      console.error('Error deleting cancelled metadata:', deleteItemError)
    } else {
      console.log('Cancelled metadata removed successfully.')
    }

    const { error: deleteLogError } = await supabase
      .from('item_history')
      .delete()
      .eq('item_id', itemId)

    if (deleteLogError) {
      console.error('Error deleting history log for cancelled item', deleteLogError)
    } else {
      console.log('History log removed after cancellation')
    }
  } catch (err) {
    console.error('Failed to cancel and delete metadata:', err)
  } finally {
    dialog.value = false
  }
}

function handleCancel() {
  selectedFile.value = null
  showDialog.value = false
}

async function logItemHistory({ itemId, itemType, action, oldData, newData, changes }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.error('Auth error:', authError)
      return
    }

    const adminName =
      `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

    const { error } = await supabase.from('item_history').insert({
      item_id: itemId,
      item_type: itemType,
      action: action,
      performed_by: adminName || 'Admin',
      old_data: oldData,
      new_data: newData,
      changes: changes,
    })

    if (error) {
      console.error('Error logging history:', error)
    } else {
      console.log('History logged successfully')
    }
  } catch (err) {
    console.error('Unexpected error logging history:', err)
  }
}

// Filter and sort options
watch(
  () => modelStore.models,
  (docs) => {
    const authors = new Map()
    const years = new Set()
    const categories = new Map([['all', 'All']])

    docs.forEach((mod) => {
      const meta = mod.metadata || {}

      if (meta.author) {
        meta.author.split(',').forEach((a) => {
          const standardized = a.trim().toLowerCase()
          if (!authors.has(standardized)) {
            authors.set(standardized, a.trim())
          }
        })
      }

      if (meta.date) {
        const year = meta.date.slice(0, 4)
        years.add(year)
      }

      if (Array.isArray(meta.categories)) {
        meta.categories.forEach((cat) => {
          const standardized = cat.trim().toLowerCase()
          if (!categories.has(standardized)) {
            categories.set(standardized, cat.trim())
          }
        })
      }
    })

    authorOptions.value = [...authors.values()].sort()
    categoryOptions.value = [...categories.values()].sort()
    dateOptions.value = [...years].sort((a, b) => b - a)
  },
  { immediate: true },
)

function applyFilters() {
  searchStore.clear()

  const filterData = {
    categories: Array.from(selectedCategories.value),
    authors: Array.from(selectedAuthors.value),
    dates: Array.from(selectedDates.value),
  }
  console.log('Applying filters:', filterData)

  // Updated to include the active sort
  modelStore.filterBy(filterData, {
    sortBy: searchStore.sortBy,
    sortOrder: searchStore.sortOrder,
  })

  // After filtering, reapply sorting
  if (searchStore.searchedModels.length > 0) {
    searchStore.sortResults(searchStore.searchedModels)
  }
}

const clearFilters = () => {
  selectedAuthors.value = new Set()
  selectedDates.value = new Set()
  selectedCategories.value = new Set(['All'])
  applyFilters()
}

function toggleCategory(categoryOption) {
  if (categoryOption === 'All') {
    selectedCategories.value = new Set(['All'])
  } else {
    selectedCategories.value.delete('All')
    if (selectedCategories.value.has(categoryOption)) {
      selectedCategories.value.delete(categoryOption)
    } else {
      selectedCategories.value.add(categoryOption)
    }
  }

  // selectedCategories.value = new Set(selectedCategories.value)
  applyFilters()
}

function toggleAuthor(authorOption) {
  if (selectedAuthors.value.has(authorOption)) {
    selectedAuthors.value.delete(authorOption)
  } else {
    selectedAuthors.value.add(authorOption)
  }

  // selectedAuthors.value = new Set(selectedAuthors.value)
  applyFilters()
}

function toggleDate(dateOption) {
  if (selectedDates.value.has(dateOption)) {
    selectedDates.value.delete(dateOption)
  } else {
    selectedDates.value.add(dateOption)
  }
  // selectedDates.value = new Set(selectedDates.value)
  applyFilters()
}

function clearAuthor() {
  selectedAuthors.value = new Set()
  applyFilters()
}

function clearDate() {
  selectedDates.value = new Set()
  applyFilters()
}

function clearCategories() {
  selectedCategories.value = new Set(['All'])
  applyFilters()
}

function applySort(option) {
  searchStore.setSort(option.value)

  // Apply sorting on the already fetched results
  if (searchStore.query) {
    searchStore.sortResults(searchStore.searchedModels)
  } else {
    modelStore.sortModels(option)
  }
}

// pagination state
const modelsCurrentPage = ref(1)
const modelsPerPage = ref(12)

function updateModelsPerPage() {
  const width = window.innerWidth

  if (width >= 1920) {
    modelsPerPage.value = 12
  } else if (width >= 1475) {
    modelsPerPage.value = 10
  } else if (width >= 1240) {
    modelsPerPage.value = 8
  } else {
    modelsPerPage.value = 6
  }
}

onMounted(() => {
  updateModelsPerPage()
  window.addEventListener('resize', updateModelsPerPage)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModelsPerPage)
})

const getBaseModels = computed(() => {
  // Prefer filtered/search results if available
  if (Array.isArray(searchStore.searchedModels) && searchStore.searchedModels.length > 0) {
    return searchStore.searchedModels
  }

  // Otherwise, show all filtered documents
  if (Array.isArray(modelStore.filteredModels) && modelStore.filteredModels.length > 0) {
    return modelStore.filteredModels
  }

  // fallback
  return []
})

const getSortedModels = computed(() => {
  const baseModels = getBaseModels.value

  if (typeof searchStore.sortResults === 'function') {
    const sorted = searchStore.sortResults(baseModels)
    // ensure it returns a valid array
    return Array.isArray(sorted) ? sorted : baseModels
  }

  return baseModels
})

const displayedModels = computed(() => {
  const docs = getSortedModels.value
  const start = (modelsCurrentPage.value - 1) * modelsPerPage.value
  const end = start + modelsPerPage.value
  return docs.slice(start, end)
})

const modelsTotalPages = computed(() => {
  const docs = getSortedModels.value
  return Math.max(1, Math.ceil(docs.length / modelsPerPage.value))
})

// pagination controls
function nextModelsPage() {
  if (modelsCurrentPage.value < modelsTotalPages.value) {
    modelsCurrentPage.value++
  }
}

function prevModelsPage() {
  if (modelsCurrentPage.value > 1) {
    modelsCurrentPage.value--
  }
}

function goToModelsPage(page) {
  modelsCurrentPage.value = page
}
</script>

<style scoped>
.view-icon {
  color: #7c7c7c;
  font-size: 18px;
}

.view-icon:hover {
  background-color: rgba(136, 0, 0, 0.1);
}

.my-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.artifact-card-section {
  min-height: 4.375rem;
}

.artifact-title {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

/* Responsive styles for buttons */
.subtitle-btn-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
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

  .artifact-btn {
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .artifact-btn-style {
    min-width: 80px;
    margin: 0.25rem !important;
  }

  .add-new-btn {
    min-width: 80px !important;
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
  .page-header {
    padding: 0 0.5rem;
  }

  .title {
    font-size: 1.5rem;
    text-align: center;
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
</style>
