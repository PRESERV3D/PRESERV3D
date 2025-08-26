<template>
  <q-page class="q-pa-md">
    <div v-if="loading">
      <q-spinner color="primary" size="lg" />
    </div>

    <div v-else-if="doc">
      <div class="row q-mt-xs q-gutter-md justify-center items-start">
        <div class="col-auto flex flex-column items-start q-mt-sm">
          <router-link to="/documents" class="back-button-top">
            <q-btn flat icon="arrow_back" label="Back to Documents" />
          </router-link>
        </div>
        <div class="col-auto">
          <q-img
            :src="doc.preview_url"
            class="document-img"
            style="margin-top: 1.5rem; z-index: 1"
          />
        </div>
        <div class="q-mt-xl col">
          <q-input
            v-model="doc.metadata.title"
            class="document-title"
            style="font-size: 20px; font-weight: bold; margin-bottom: 2rem"
            dense
            outlined
          />
          <div class="row items-center">
            <q-input
              v-model="doc.metadata.author"
              class="sub-font-3"
              style="font-size: 16px; max-width: 25rem"
              dense
              outlined
            />
            <div v-if="isAdmin" class="edit-delete-btns row">
              <q-btn label="Cancel" class="q-mr-md sub-font-3" no-caps flat @click="goBack" />
              <!-- <q-btn
                flat
                no-caps
                dense
                label="Find More Info"
                class="find-more-info-btn"
                @click="
                  fetchRelatedLinks(
                    doc.metadata.title,
                    doc.metadata.author,
                    doc.metadata.categories,
                  )
                "
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

      <div class="preview-container">
        <div class="box-view">
          <div class="row items-center">
            <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 10rem">Tags:</div>
            <div class="tags">
              <!-- <span class="tag-box" v-for="(category, i) in doc.metadata.categories" :key="i">
                {{ category }}
              </span> -->
              <template v-if="editableCategories && editableCategories.length > 0">
                <q-chip
                  v-for="(category, i) in editableCategories"
                  :key="i"
                  class="tag-box"
                  removable
                  @remove="removeCategory(i)"
                >
                  {{ category }}
                </q-chip>
              </template>
              <template v-else>
                <!-- Fallback placeholder category as there are no data yet -->
                <q-chip class="q-mr-sm q-mt-xs tag-box"> Uncategorized </q-chip>
              </template>
              <!-- Add Category Input: Change this to a pop up -->
              <!-- <q-input
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
              </q-input> -->

              <!-- Add category icon -->
              <q-btn
                flat
                dense
                icon="add"
                size="sm"
                class="add-category-btn q-mt-xs"
                @click="showCategoriesDialog = true"
                v-show="!showCategoryInput"
              />

              <!-- Category Dialog -->
              <q-dialog v-model="showCategoriesDialog" persistent>
                <q-card class="cat-box" style="min-width: 350px">
                  <!-- Header -->
                  <q-card-section
                    class="column items-start"
                    style="font-size: 16px; font-weight: 700"
                  >
                    Categories
                  </q-card-section>
                  <q-separator />

                  <!-- Categories List -->
                  <div class="q-pt-md q-px-md column items-start full-width">
                    <div
                      v-for="category in categories"
                      :key="category.id"
                      class="row items-center justify-between full-width q-mb-xs"
                    >
                      <!-- Left side: checkbox + name -->
                      <div class="row items-center">
                        <q-checkbox v-model="category.selected" color="primary" size="xs" />
                        <div class="category-style q-ml-sm">{{ category.name }}</div>
                      </div>

                      <!-- Right side: delete button -->
                      <q-btn
                        flat
                        round
                        icon="delete"
                        color="negative"
                        size="sm"
                        @click="deleteCategory(category.id)"
                      />
                    </div>

                    <!-- Add new category -->
                    <q-input
                      v-model="newCategory"
                      placeholder="Add new Category"
                      borderless
                      dense
                      class="q-mt-sm full-width"
                      @keyup.enter="addCategory"
                    >
                      <template v-slot:prepend>
                        <q-btn
                          round
                          dense
                          outline
                          color="black"
                          icon="add"
                          size="sm"
                          @click="addCategory"
                        />
                      </template>
                    </q-input>
                  </div>

                  <!-- Save or Cancel -->
                  <q-card-actions align="right">
                    <q-btn flat label="Close" color="black" v-close-popup no-caps />
                    <q-btn label="Save" class="btn-save" flat @click="saveCategories" />
                    <!--need fixing-->
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
          </div>

          <div class="row description-row">
            <div class="description-section">
              <div class="q-ml-md sub-font-3" style="font-size: 16px; margin-top: 2rem">
                Description
              </div>
              <div class="summary">
                <q-input
                  v-model="doc.metadata.summary"
                  type="textarea"
                  outlined
                  dense
                  class="q-ml-md summary-input"
                  :input-style="{ minHeight: '60px' }"
                />
              </div>
              <div class="q-ma-md link" @click="showRelatedDialog = true">Related Links</div>
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
                        @click="cancelChanges()"
                      />
                      <q-btn
                        flat
                        no-caps
                        dense
                        label="Find More Info"
                        class="find-more-info-btn"
                        @click="
                          fetchRelatedLinks(
                            doc.metadata.title,
                            doc.metadata.author,
                            doc.metadata.categories,
                            doc.metadata.date.slice(0, 4),
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
                            doc.metadata.title,
                            doc.metadata.author,
                            doc.metadata.categories,
                            doc.metadata.date.slice(0, 4),
                          )
                        "
                      />
                    </template>
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
            <div class="meta-section">
              <div class="font-label">
                <p><strong>Uploaded At:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated At:</strong> {{ formatDate(doc.updated_at) }}</p>
                <p>
                  <strong>Date:</strong>
                  <q-btn outline dense :label="doc.metadata.date || 'Select Date'" class="q-ml-sm">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="doc.metadata.date" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-btn>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <q-banner type="negative">Document not found.</q-banner>
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
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Notification Dialog -->
    <q-dialog v-model="notifyDialogOpen">
      <q-card class="sucess-add-to-collection">
        <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">
          {{ notifyDialogTitle }}
        </q-card-section>
        <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">
          {{ notifyDialogMessage }}
        </q-card-section>
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
import { useUserStore } from 'stores/user'
import { useDocumentsStore } from 'stores/documentsStore'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const doc = ref(null)
const loading = ref(true)

// const dialog = ref(false)
// const metadata = ref(null)
const documentsStore = useDocumentsStore()
const userStore = useUserStore()
// const user = userStore.profile.first_name + ' ' + userStore.profile.last_name

const userRole = userStore.profile.role
const isAdmin = computed(() => userRole === 'admin')

const dialogOpen = ref(false)

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

//new add
// Editing logic from doc page
async function saveChanges() {
  try {
    if (!doc.value) return

    const { error } = await supabase
      .from('documents_metadata')
      .update({
        metadata: {
          ...doc.value.metadata,
          categories: editableCategories.value,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', route.params.id)

    if (error) throw error

    console.log('Document changes saved successfully')
    router.push({ name: 'view-document', params: { id: route.params.id } })
  } catch (err) {
    console.error('Error saving document changes:', err)
  }
}

const goBack = () => {
  window.history.back()
}

//

// const showCategoryDialog = ref(false)
// const newCategory = ref('')

// const showCategoryInput = ref(false)

// Category management functions

const showCategoriesDialog = ref(false)
const categories = ref([])
const newCategory = ref('')
const editableCategories = ref([])

function addCategory() {
  if (newCategory.value.trim()) {
    categories.value.push({
      id: Date.now(),
      name: newCategory.value,
      selected: false,
    })
    newCategory.value = ''
  }
}
// const toggleCategoryInput = () => {
//   showCategoryInput.value = true
//   setTimeout(() => {
//     const input = document.querySelector('.add-category-input input')
//     if (input) input.focus()
//   }, 100)
// }

// const addCategory = () => {
//   if (newCategory.value.trim() && !editableCategories.value.includes(newCategory.value.trim())) {
//     editableCategories.value.push(newCategory.value.trim())
//     newCategory.value = ''
//     showCategoryInput.value = false
//   }
// }

const removeCategory = (index) => {
  editableCategories.value.splice(index, 1)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('documents_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Document not found from Supabase:', error)
    // Optional: fallback to store if you have a docuStore like modelStore
    // const docuStore = useDocuStore()
    doc.value = documentsStore.documents.find((d) => d.id == route.params.id) || null
    console.log('Fallback Document from Store:', doc.value)
  } else {
    // Initialize with default bookmark/star states
    doc.value = {
      ...data,
      bookmarked: false,
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

  // ADDED: Check if the document is in user's Favorites collection
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
        .eq('item_type', 'document')
        .eq('item_id', route.params.id)

      if (favItems?.length > 0) {
        doc.value.starred = true
      }
    }
  }

  await documentsStore.fetchStarCounts()
  await documentsStore.fetchViewCounts()
})

//
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
      .from('documents_metadata')
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

async function cancelChanges() {
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
.preview-container {
  position: relative;
  display: block;
  flex-direction: column;
}

.box-view {
  position: relative;
  padding: 2rem;
  border-radius: 10px;
  background-color: #ffffff;
  width: auto;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
  z-index: 0;
  margin-top: 0;
}

.description-row {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.description-section {
  flex: 0 0 60%;
}

.meta-section {
  flex: 0 0 35%;
}

.font-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #000000;
  margin-top: 2rem;
  margin-left: 1rem;
}

.document-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 3rem;
  color: #560505;
}

.document-img {
  width: 300px;
  margin-left: 10rem;
  margin-right: 2rem;
  z-index: 1;
  position: relative;
  margin-bottom: -10rem;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.actions {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #880000;
}

.row-1 {
  margin-left: 30.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.start-reading-btn {
  background-color: #363636;
  color: white;
  border-radius: 20px;
  font-weight: 400;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  height: 2rem;
  width: 10rem;
  place-content: center;
  align-items: center;
}

.btn-arrow-tilt {
  width: 0.6rem;
  height: 0.6rem;
  object-fit: contain;
}

.summary {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #000000;
  margin-top: 1rem;
}

.summary-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: 1.4 !important;
}

.summary-input {
  width: 100%;
}

.add-category-input {
  max-width: 200px;
}
</style>
