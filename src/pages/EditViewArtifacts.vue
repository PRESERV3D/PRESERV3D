<template>
  <q-page class="q-pa-md">
    <router-link to="/artifacts" class="back-button-top">
      <q-btn flat icon="arrow_back" label="Back to Artifacts" />
    </router-link>

    <div v-if="loading" class="loading-container">
      <q-spinner size="xl" />
    </div>

    <div v-else-if="model" class="artifact-detail-container">
      <!-- Editable Artifact Name/Title at the top -->
      <div class="title-section q-mb-lg">
        <q-input
          v-model="editableData.title"
          class="title-input"
          borderless
          input-class="a-title"
        />
      </div>

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
              <template v-if="editableCategories && editableCategories.length > 0">
                <q-chip
                  v-for="(category, i) in editableCategories"
                  :key="i"
                  class="category-tag"
                  removable
                  @remove="removeCategory(i)"
                >
                  {{ category }}
                </q-chip>
              </template>
              <template v-else>
                <!-- Fallback placeholder category as there are no data yet -->
                <q-chip class="q-mr-sm q-mt-xs category-tag"> Uncategorized </q-chip>
              </template>

              <!-- Add Category Input -->
              <q-input
                v-model="newCategory"
                dense
                borderless
                placeholder="Add category"
                class="add-category-input"
                @keyup.enter="addCategory"
                :class="{ 'input-hidden': !showCategoryInput }"
                v-show="showCategoryInput"
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    icon="check"
                    @click="addCategory"
                    :disable="!newCategory.trim()"
                  />
                </template>
              </q-input>

              <!-- Add category icon -->
              <q-btn
                flat
                dense
                icon="add"
                class="add-category-btn q-mt-xs"
                @click="toggleCategoryInput"
                v-show="!showCategoryInput"
              />

              <!-- Action icons -->
              <div class="action-icons">
                <!-- Bookmark functionality commented out for now -->
                <!--
                <q-icon
                  :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                  class="bookmark-icon q-mr-md"
                  :class="{ 'bookmarked': model.bookmarked }"
                  size="sm"
                  @click.stop="toggleBookmark(model.id)"
                />
                -->
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="summary-section q-mb-md">
            <h6 class="a-info-title q-mb-sm q-mt-sm">Summary</h6>
            <q-input
              v-model="editableData.summary"
              type="textarea"
              outlined
              dense
              class="summary-input"
              :input-style="{ minHeight: '60px' }"
            />
          </div>

          <!-- Related Links -->
          <div class="q-mb-md link" @click="showRelatedDialog = true"
               style="margin-left: 0; margin-bottom: 5px; text-align: left;">Show Related Links</div>
          <!-- q-dialog for related links -->
          <q-dialog v-model="showRelatedDialog" persistent>
            <q-card class="related-box">
              <q-card-section
                class="column sub-font-3 items-start"
                style="font-size: 16px; font-weight: 700"
              >
                Related Links
              </q-card-section>
              <q-separator />
              <div v-if="loadingRelatedLinks" class="q-pa-md flex flex-center">
                <q-spinner color="primary" size="40px" />
              </div>
              <div v-else class="q-pt-md q-px-md column items-start">
                <!-- Links List with Drag -->
                <div
                  v-for="(link, index) in links"
                  :key="link.id"
                  class="row items-center q-mb-xs full-width draggable-item"
                  draggable="true"
                  @dragstart="dragStart(index)"
                  @dragover.prevent
                  @drop="drop(index)"
                >
                  <!-- Drag handle -->
                  <q-icon name="menu" class="q-mr-md cursor-pointer" size="xs" color="black" />

                  <!-- Link (inline beside icon) -->
                  <div class="link-style" @click="openLink(link.url)">
                    {{ link.title || link.url }}
                  </div>

                  <!-- Spacer pushes delete icon to far right -->
                  <q-space />

                  <!-- Delete button -->
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="deleteLink(index)"
                  />
                </div>

                <!-- Add link input -->
                <q-input
                  v-model="newLink"
                  placeholder="Add new link"
                  borderless
                  dense
                  class="q-mt-sm"
                  @keyup.enter="addLink"
                >
                  <template v-slot:prepend>
                    <q-btn
                      round
                      dense
                      outline
                      color="black"
                      icon="add"
                      size="sm"
                      @click="addLink"
                    />
                  </template>
                </q-input>
              </div>
              <!--Save and Cancel-->
              <q-card-actions align="right">
                <template v-if="hasChanges">
                  <q-btn
                    flat
                    label="Cancel"
                    class="sub-font-2"
                    style="color: #000000"
                    v-close-popup
                    no-caps
                    @click="cancelRelatedLinks()"
                  />
                  <q-btn
                    flat
                    no-caps
                    dense
                    label="Find More Info"
                    class="find-more-info-btn"
                    @click="
                      fetchRelatedLinks(
                        editableData.title,
                        editableData.author,
                        editableData.categories,
                        editableData.date.slice(0, 4),
                      )
                    "
                  />
                  <q-btn label="Save" class="btn-save" flat @click="saveRelatedLinks" />
                </template>
                <template v-else>
                  <q-btn
                    flat
                    label="Close"
                    class="sub-font-2"
                    style="color: #000000"
                    v-close-popup
                    no-caps
                  />
                  <q-btn
                    flat
                    no-caps
                    dense
                    label="Find More Info"
                    class="find-more-info-btn"
                    @click="
                      fetchRelatedLinks(
                        editableData.title,
                        editableData.author,
                        editableData.categories,
                        editableData.date.slice(0, 4),
                      )
                    "
                  />
                </template>
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Two-Column Section -->
          <div class="two-column-details q-mt-md q-mb-lg">
            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="inline-edit-container">
                  <q-input
                    v-model="editableLabels.author"
                    borderless
                    dense
                    class="a-info-title2"
                    :input-style="{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: 'black',
                      fontFamily: 'Poppins, sans-serif',
                    }"
                  />
                </div>
                <q-input v-model="editableData.author" outlined dense class="detail-input" />
              </div>
              <div class="detail-value">
                <div class="inline-edit-container">
                  <q-input
                    v-model="editableLabels.date"
                    borderless
                    dense
                    class="a-info-title2"
                    :input-style="{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: 'black',
                      fontFamily: 'Poppins, sans-serif',
                    }"
                  />
                </div>
                <q-input
                  v-model="editableData.date"
                  outlined
                  dense
                  class="detail-input"
                  type="date"
                />
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
              <q-input
                v-model="editableData.dataSource"
                outlined
                dense
                class="detail-input full-width"
              />
            </div>

            <!-- User Info with side-by-side layout -->
            <div class="side-by-side-details q-mb-lg">
              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Donated/Loaned By:</div>
                </div>
                <div class="detail-value">
                  <q-input v-model="editableData.donatedBy" outlined dense class="detail-input" />
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Date Received:</div>
                </div>
                <div class="detail-value">
                  <q-input
                    v-model="editableData.dateReceived"
                    outlined
                    dense
                    class="detail-input"
                    type="datetime-local"
                  />
                </div>
              </div>
            </div>

            <!-- Save/Cancel Actions -->
            <div class="save-cancel-actions q-mt-lg">
              <q-btn flat no-caps dense label="Cancel" class="cancel-btn" @click="cancelChanges" />
              <div class="button-group">
                <!-- <q-btn
                  flat
                  no-caps
                  dense
                  label="Find More Info"
                  class="find-more-info-btn"
                  @click="findMoreInfo"
                /> -->
                <q-btn
                  flat
                  no-caps
                  dense
                  label="Save"
                  class="func-btn q-ml-auto"
                  color="primary"
                  @click="saveChanges"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <q-banner type="negative">Artifact not found.</q-banner>
    </div>

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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const modelStore = useModelStore()

const model = ref(null)
const loading = ref(true)

// Editing logic from Artifacts page
const newCategory = ref('')
const editableCategories = ref([])
const showCategoryInput = ref(false)

// Reactive reference for editable labels
const editableLabels = ref({
  author: 'Author',
  date: 'Date',
  dataSource: 'Data Source',
  donatedBy: 'Donated/Loaned By:',
  dateReceived: 'Date Received:',
})

// Reactive reference for all editable data
const editableData = ref({
  title: '',
  summary: '',
  author: '',
  date: '',
  dataSource: '',
  donatedBy: '',
  dateReceived: '',
})

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

function formatDateForInput(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().slice(0, 16)
}

// Initialize editable data when model changes
watch(
  model,
  (newModel) => {
    if (newModel) {
      // Initialize categories
      if (newModel.metadata?.categories) {
        editableCategories.value = [...newModel.metadata.categories]
      } else {
        editableCategories.value = []
      }

      // Initialize all editable data
      editableData.value = {
        title: newModel.metadata?.title || 'Untitled Artifact',
        summary: newModel.metadata?.summary || '',
        author: newModel.metadata?.author || '[Author Name]',
        date: newModel.metadata?.date || '',
        dataSource: newModel.data_source || 'Artifacts Metadata',
        donatedBy: newModel.donated_by || '[Donor/Lender Name]',
        dateReceived: formatDateForInput(newModel.date_received || newModel.uploaded_at),
      }
    } else {
      editableCategories.value = []
      editableData.value = {
        title: '',
        summary: '',
        author: '',
        date: '',
        dataSource: '',
        donatedBy: '',
        dateReceived: '',
      }
    }
  },
  { immediate: true },
)

// Category management functions
const toggleCategoryInput = () => {
  showCategoryInput.value = true
  setTimeout(() => {
    const input = document.querySelector('.add-category-input input')
    if (input) input.focus()
  }, 100)
}

const addCategory = () => {
  if (newCategory.value.trim() && !editableCategories.value.includes(newCategory.value.trim())) {
    editableCategories.value.push(newCategory.value.trim())
    newCategory.value = ''
    showCategoryInput.value = false
  }
}

const removeCategory = (index) => {
  editableCategories.value.splice(index, 1)
}

// Save and Cancel functions
const saveChanges = async () => {
  if (model.value) {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('artifacts_metadata')
        .update({
          metadata: {
            ...model.value.metadata,
            title: editableData.value.title,
            categories: [...editableCategories.value],
            summary: editableData.value.summary,
            author: editableData.value.author,
            date: editableData.value.date,
          },
          data_source: editableData.value.dataSource,
          donated_by: editableData.value.donatedBy,
          date_received: editableData.value.dateReceived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', model.value.id)

      if (error) {
        console.error('Error updating artifact:', error)
        showNotifyDialog('Error', 'Failed to save changes.')
        return
      }

      // Update local model
      model.value = {
        ...model.value,
        metadata: {
          ...model.value.metadata,
          title: editableData.value.title,
          categories: [...editableCategories.value],
          summary: editableData.value.summary,
          author: editableData.value.author,
          date: editableData.value.date,
        },
        data_source: editableData.value.dataSource,
        donated_by: editableData.value.donatedBy,
        date_received: editableData.value.dateReceived,
        updated_at: new Date().toISOString(),
      }

      // Update in store if exists
      const storeModel = modelStore.models.find((m) => m.id === model.value.id)
      if (storeModel) {
        Object.assign(storeModel, model.value)
      }

      console.log('Changes saved:', model.value)

      // Redirect to artifacts page
      router.push(`/artifacts/${model.value.id}`)
    } catch (err) {
      console.error('Unexpected error:', err)
      showNotifyDialog('Error', 'An unexpected error occurred.')
    }
  }
}

// Update your existing cancelChanges function in the script setup
const cancelChanges = () => {
  if (model.value) {
    if (model.value.metadata?.categories) {
      editableCategories.value = [...model.value.metadata.categories]
    } else {
      editableCategories.value = []
    }

    editableData.value = {
      title: model.value.metadata?.title || 'Untitled Artifact',
      summary: model.value.metadata?.summary || '',
      author: model.value.metadata?.author || '[Author Name]',
      date: model.value.metadata?.date || '',
      dataSource: model.value.data_source || 'Artifacts Metadata',
      donatedBy: model.value.donated_by || '[Donor/Lender Name]',
      dateReceived: formatDateForInput(model.value.date_received || model.value.uploaded_at),
    }
  }
  newCategory.value = ''
  showCategoryInput.value = false
  console.log('Changes cancelled')

  // Route to view-artifact page
  router.push(`/artifacts/${route.params.id}`)
}

// Commented out bookmark functionality for now
// const toggleBookmark = async (modelId) => {
//   if (!model.value) return
//
//   model.value.bookmarked = !model.value.bookmarked
//
//   const storeModel = modelStore.models.find(m => m.id === modelId)
//   if (storeModel) {
//     storeModel.bookmarked = model.value.bookmarked
//   }
//
//   if (model.value.bookmarked) {
//     openBookmarkDialog(model.value, 'artifact')
//   }
// }

// Collection dialog methods
// const openBookmarkDialog = async (modelItem, type = 'artifact') => {
//   selectedModel.value = modelItem
//   selectedItemType.value = type
//   dialogOpen.value = true
//
//   await loadUserCollections()
//
//   const { data: existingItems, error } = await supabase
//     .from('collection_items')
//     .select('collection_id')
//     .eq('item_id', modelItem.id)
//     .eq('item_type', type)
//
//   if (error) {
//     console.error('Error checking existing collections:', error)
//     selectedCollections.value = []
//     existingCollectionIds.value = []
//     return
//   }
//
//   const existingIds = existingItems.map((item) => item.collection_id)
//   selectedCollections.value = [...existingIds]
//   existingCollectionIds.value = [...existingIds]
// }
//
// const loadUserCollections = async () => {
//   const { data: authData, error: authError } = await supabase.auth.getUser()
//   const userId = authData?.user?.id
//
//   if (authError || !userId) {
//     console.error('Auth error loading collections:', authError)
//     return
//   }
//
//   const { data, error } = await supabase
//     .from('collections')
//     .select('collection_id, collection_name')
//     .eq('user_id', userId)
//
//   if (!error) {
//     userCollections.value = data
//   } else {
//     console.error('Failed to load collections:', error)
//   }
// }

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
    model.value = modelStore.models.find((m) => m.id == route.params.id) || null
    console.log('Fallback Model from Store:', model.value)
  } else {
    model.value = {
      ...data,
      // bookmarked: false,
      starred: false,
    }

    if (data.related_links && Array.isArray(data.related_links)) {
      links.value = data.related_links.map((link, idx) => ({
        id: link.id || Date.now() + idx,
        title: link.title,
        url: link.url,
      }))
    }
  }

  loading.value = false
})

// Related Links
const showRelatedDialog = ref(false)
const newLink = ref('')
const links = ref([]) // starts empty
const hasChanges = ref(false)
const loadingRelatedLinks = ref(false)
let draggedIndex = null

async function fetchRelatedLinks(title, author, categories, date) {
  try {
    console.log('Fetching related links for:', title, author, categories, date)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('author', author)
    formData.append('categories', categories)
    formData.append('date', date)

    loadingRelatedLinks.value = true

    const { data } = await axios.get('http://localhost:8000/related-links', {
      params: {
        title,
        author,
        categories,
        date,
      },
    })

    // assuming data.links is an array of URLs
    links.value = data.links.map((link, idx) => ({
      id: Date.now() + idx,
      title: link.title,
      url: link.url,
    }))

    hasChanges.value = true
    showRelatedDialog.value = true
  } catch (err) {
    console.error('Error fetching related links:', err)
  } finally {
    loadingRelatedLinks.value = false
  }
}

function addLink() {
  if (newLink.value.trim() !== '') {
    links.value.push({ id: Date.now(), url: newLink.value.trim() })
    newLink.value = ''
    hasChanges.value = true
  }
}

function deleteLink(index) {
  links.value.splice(index, 1)
  hasChanges.value = true
}

function openLink(url) {
  window.open(url, '_blank')
}

function dragStart(index) {
  draggedIndex = index
}

function drop(index) {
  const movedItem = links.value.splice(draggedIndex, 1)[0]
  links.value.splice(index, 0, movedItem)
  hasChanges.value = true
}

async function saveRelatedLinks() {
  try {
    // Save directly to Supabase
    const { error } = await supabase
      .from('artifacts_metadata')
      .update({
        related_links: links.value,
      })
      .eq('id', route.params.id)

    if (error) throw error

    console.log('Related links saved successfully:', links.value)

    hasChanges.value = false
    showRelatedDialog.value = false
  } catch (err) {
    console.error('Error fetching/saving related links:', err)
    console.log('Error saving related links:', err)
  }
}

async function cancelRelatedLinks() {
  // Reset the links to the original state
  const { data } = await supabase
    .from('documents_metadata')
    .select('related_links')
    .eq('id', route.params.id)
    .single()

  if (data && Array.isArray(data.related_links)) {
    links.value = data.related_links.map((link, idx) => ({
      id: link.id || Date.now() + idx,
      title: link.title,
      url: link.url,
    }))
  }

  hasChanges.value = false
  showRelatedDialog.value = false
}
</script>

<style scoped>
/* ADMIN VIEW PAGE ARTIFACT */

.title-section {
  width: 100%;
  text-align: center;
  margin-bottom: 2rem;
}

.title-input {
  width: 100%;
  max-width: 800px;
  margin-left: 30rem;
}

.title-input :deep(.q-field__control) {
  padding: 0 !important;
  min-height: auto !important;
  overflow: visible !important;
}

.title-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
  font-size: clamp(32px, 6vw, 64px) !important;
  color: #560505 !important;
  padding: 16px 0 !important;
  line-height: 1.2 !important;
  text-align: center !important;
  width: 100% !important;
  margin: 0 !important;
  border: none !important;
  outline: none !important;
}

.title-input .a-title {
  margin-left: 0 !important;
  margin-top: 0 !important;
}

/* Category management */
.add-category-input {
  max-width: 200px;
}

.add-category-btn {
  margin-left: 8px;
  margin-top: 0;
  color: #666;
}

.add-category-btn:hover {
  color: #333;
  background-color: #f5f5f5;
}

/* Save/Cancel actions */
.save-cancel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  color: #666;
  font-weight: 600 !important;
  font-family: 'Poppins', sans-serif !important;
}

.cancel-btn:hover {
  color: #333;
  background-color: #f5f5f5;
}

.save-btn {
  margin-left: auto;
}

.text-button {
  color: black !important;
  text-decoration: none;
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 4px 8px;
}

.text-button:hover {
  background: none !important;
  color: #333 !important;
}

/* Layout and spacing */
.category-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.categories-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  margin-left: -4px;
}

.detail-input {
  margin-top: 8px;
}

.detail-input :deep(.q-field__native),
.summary-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: 1.4 !important;
}

.full-width {
  width: 100%;
}

.summary-input {
  width: 100%;
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
}

.large-artifacts {
  width: 600px !important;
  height: 600px !important;
  border-radius: 8px;
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

.side-by-side-details .detail-row {
  align-items: flex-start;
}

.side-by-side-details .detail-input {
  margin-top: 0 !important;
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
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.categories-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.button-group {
  display: flex;
  align-items: center;
  margin-left: auto;
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

  .back-button-top {
    top: 0.5rem;
    left: 0.5rem;
  }

  .top-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-icons {
    margin-top: 1rem;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .title-input :deep(.q-field__native) {
    font-size: 32px !important;
    padding: 12px 0 !important;
  }

  .title-section {
    margin-bottom: 1rem;
  }
}
</style>
