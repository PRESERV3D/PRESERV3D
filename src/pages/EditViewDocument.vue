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
            v-model="editableData.title"
            class="sub-font-3 q-mb-md"
            style="font-size: 20px"
            dense
            outlined
          />
          <div class="row items-center">
            <q-input
              v-model="editableData.author"
              class="sub-font-3 q-mb-md author-input"
              style="font-size: 16px"
              dense
              outlined
            />
            <div v-if="isAdmin" class="edit-delete-btns row q-mb-md">
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
            <div class="q-ml-md sub-font-3 space" style="font-size: 16px">Tags:</div>
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
              />

              <!-- Category Dialog -->
              <q-dialog v-model="showCategoriesDialog" persistent>
                <q-card class="cat-box">
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
                          size="xs"
                          @click="addCategory"
                          :disable="!newCategory.trim()"
                        />
                      </template>
                    </q-input>
                  </div>
                  <!-- Save or Cancel -->
                  <q-card-actions align="right">
                    <q-btn flat label="Close" color="black" v-close-popup no-caps />
                    <q-btn label="Save" class="btn-save" flat @click="saveCategories" />
                    <!--need fixing in backend-->
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <!-- Delete Category Error Dialog -->
              <q-dialog v-model="showDeleteErrorDialog">
                <q-card>
                  <q-card-section class="text-h6 text-negative">
                    Cannot Delete Category
                  </q-card-section>

                  <q-card-section>
                    {{ deleteErrorMessage }}
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn flat label="OK" color="primary" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </div>
          </div>

          <div class="row description-row">
            <div class="description-section">
              <div
                class="q-ml-md sub-font-3"
                style="font-size: 16px; margin-top: 2rem; margin-bottom: 1rem"
              >
                Description
              </div>

              <q-input
                v-model="editableData.summary"
                type="textarea"
                outlined
                dense
                class="q-ml-md summary-input"
                :input-style="{ minHeight: '8rem' }"
              />

              <!-- Generate Summary Button -->
              <q-btn
                flat
                no-caps
                dense
                label="Generate"
                class="q-ml-md find-more-info-btn"
                style="margin-top: 1rem"
                @click="generateSummary"
              />

              <q-dialog v-model="showSummaryDialog" persistent>
                <q-card style="min-width: 400px; max-width: 600px; position: relative">
                  <q-card-section>
                    <div v-if="summaryLoading" style="text-align: center">
                      <div style="font-weight: bold; margin-bottom: 5px">Simon Says</div>
                      <div
                        style="display: flex; justify-content: center; gap: 5px; flex-wrap: wrap"
                      >
                        <div
                          v-for="color in colors"
                          :key="color"
                          :style="{
                            background: color,
                            width: '60px',
                            height: '60px',
                            borderRadius: '10px',
                            opacity: activeColor === color ? 1 : 0.5,
                            cursor: 'pointer',
                          }"
                          @click="handleColorClick(color)"
                        ></div>
                      </div>
                      <div style="margin-top: 10px">Score: {{ simonScore }}</div>
                      <div style="margin-top: 5px">Generating summary...</div>
                    </div>

                    <div v-else>
                      <q-input
                        v-model="summary"
                        type="textarea"
                        outlined
                        dense
                        style="min-height: 120px"
                      />
                    </div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Cancel"
                      color="negative"
                      @click="showSummaryDialog = false"
                    />
                    <q-btn
                      flat
                      label="Save"
                      color="primary"
                      @click="saveSummary"
                      :disable="summaryLoading"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <div class="q-ma-md link" @click="showRelatedDialog = true">Show Related Links</div>
              <!-- q-dialog for related links -->
              <q-dialog v-model="showRelatedDialog" persistent>
                <q-card class="related-box">
                  <q-card-section
                    class="column sub-font-3 items-start"
                    style="font-size: 16px; font-weight: 700"
                  >
                    Show Related Links
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
                          size="xs"
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
                <p><strong>Uploaded On:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated On:</strong> {{ formatDate(doc.updated_at) }}</p>
                <p>
                  <strong>Date:</strong>
                  <q-btn outline dense :label="editableData.date || 'Select Date'" class="q-ml-sm">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="editableData.date" mask="YYYY-MM-DD" />
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'stores/user'
import { useDocumentsStore } from 'stores/documentsStore'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { getNlpEndpoint } from 'src/utils/nlpConfig'

const route = useRoute()
const router = useRouter()
const doc = ref(null)
const loading = ref(true)
const summaryLoading = ref(false)

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

// Generate Summary
const $q = useQuasar()
const summary = ref('')
const showSummaryDialog = ref(false)
const docId = route.params.id

// Loading Mini Game
const colors = ['red', 'green', 'blue', 'yellow']
const simonSequence = ref([])
const userSequence = ref([])
const activeColor = ref(null)
const simonScore = ref(0)

// Reactive reference for all editable data
const editableData = ref({
  date: '',
  title: '',
  author: '',
  summary: '',
  extracted_text: '',
})

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

async function saveChanges() {
  if (!doc.value) return

  try {
    const oldData = {
      metadata: { ...doc.value.metadata },
      related_links: doc.value.related_links,
      updated_at: doc.value.updated_at,
    }

    const newData = {
      metadata: {
        ...doc.value.metadata,
        title: editableData.value.title,
        date: editableData.value.date,
        author: editableData.value.author,
        summary: editableData.value.summary,
        categories: [...editableCategories.value],
        // extracted_text: editableData.value.extracted_text,
      },
      related_links: [...links.value],
    }

    let changes = getChanges(oldData, newData)

    if (Object.keys(changes).length === 0) {
      showNotifyDialog('Info', 'No changes made.')
      return
    }

    const updatedAt = new Date().toISOString()
    newData.updated_at = updatedAt

    changes = {
      ...changes,
      updated_at: { old: normalizeDate(oldData.updated_at), new: normalizeDate(updatedAt) },
    }

    const { error } = await supabase
      .from('documents_metadata')
      .update(newData)
      .eq('id', doc.value.id)

    if (error) {
      console.error('Error updating document: ', error)
      showNotifyDialog('Error', 'Failed to save changes')
      return
    }

    await logItemHistory({
      itemId: doc.value.id,
      itemType: 'document',
      action: 'update',
      oldData,
      newData,
      changes,
    })

    doc.value = {
      ...doc.value,
      ...newData,
    }

    const storeDocument = documentsStore.documents.find((d) => d.id === doc.value.id)
    if (storeDocument) Object.assign(storeDocument, doc.value)

    console.log('Changes saved: ', doc.value)
    // router.push({ name: 'view-document', params: { id: route.params.id } })
    router.push(`/documents/${doc.value.id}`)
  } catch (err) {
    console.error('Error saving document changes:', err)
  }
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

function normalizeDate(value) {
  if (!value) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toISOString()
}

function diffLinks(oldLinks = [], newLinks = []) {
  const oldMap = new Map((oldLinks || []).map((link) => [link.url, link]))
  const newMap = new Map((newLinks || []).map((link) => [link.url, link]))

  const added = []
  const removed = []

  for (const [url, link] of newMap) {
    if (!oldMap.has(url)) added.push(link)
  }

  for (const [url, link] of oldMap) {
    if (!newMap.has(url)) removed.push(link)
  }

  return { added, removed }
}

function getChanges(oldData, newData) {
  const changes = {}

  // Compare metadata
  const metadataChanges = {}
  for (const field in newData.metadata) {
    let oldValue = oldData.metadata?.[field]
    let newValue = newData.metadata?.[field]

    if (field.toLowerCase().includes('date')) {
      oldValue = normalizeDate(oldValue)
      newValue = normalizeDate(newValue)
    }

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      metadataChanges[field] = { old: oldValue, new: newValue }
    }
  }
  if (Object.keys(metadataChanges).length > 0) {
    changes.metadata = metadataChanges
  }

  // Compare top-level fields
  for (const field of Object.keys(newData)) {
    if (field === 'metadata' || field === 'updated_at') continue

    let oldValue = oldData[field]
    let newValue = newData[field]

    if (field === 'related_links') {
      const { added, removed } = diffLinks(oldValue, newValue)
      if (added.length || removed.length) {
        changes.related_links = {}
        if (added.length) changes.related_links.added = added
        if (removed.length) changes.related_links.removed = removed
      }
      continue
    }

    if (field.toLowerCase().includes('date')) {
      oldValue = normalizeDate(oldValue)
      newValue = normalizeDate(newValue)
    }

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = { old: oldValue, new: newValue }
    }
  }

  return changes
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

// function addCategory() {
//   const name = newCategory.value.trim()
//   if (!name) return

//   // prevent duplicate category names
//   const exists = categories.value.some((c) => c.name.toLowerCase() === name.toLowerCase())
//   if (!exists) {
//     categories.value.push({
//       id: Date.now(),
//       name,
//       selected: true, // auto-select when added
//     })
//   }

//   newCategory.value = ''
// }
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

// Fetch categories from Supabase when dialog opens or on mount
async function loadCategories(doc) {
  const docCategories = doc.metadata?.categories || []
  const { data, error } = await supabase.from('categories').select('id, type, category')

  if (error) {
    console.error('Error loading categories:', error)
    return
  }

  // Populate the chips with existing selected categories
  editableCategories.value = docCategories

  // Map DB data to local structure with checkbox state
  categories.value = data
    .filter((c) => c.type === 'document')
    .map((c) => ({
      id: c.id,
      name: c.category,
      selected: docCategories.includes(c.category),
    }))
}

// Add new category (save to DB + local list)
async function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return

  // check if category already exists in DB
  const exists = categories.value.some((c) => c.name.toLowerCase() === name.toLowerCase())
  if (exists) {
    console.warn('Category already exists:', name)
    return
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{ type: 'document', category: name }])
    .select()

  if (error) {
    console.error('Error adding category:', error)
    return
  }

  // push to local list
  categories.value.push({
    id: data[0].id,
    name: data[0].category,
    selected: true,
  })

  newCategory.value = ''
}

// Save selected categories for the current document
async function saveCategories() {
  // update the chips
  editableCategories.value = categories.value.filter((c) => c.selected).map((c) => c.name)

  showCategoriesDialog.value = false
}

// Remove chip
function removeCategory(index) {
  const removed = editableCategories.value[index]
  editableCategories.value.splice(index, 1)

  // Uncheck in categories dialog list
  const found = categories.value.find((c) => c.name === removed)
  if (found) found.selected = false
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

// Delete a category by ID
const showDeleteErrorDialog = ref(false)
const deleteErrorMessage = ref('')

async function deleteCategory(categoryId) {
  // Find the category being deleted
  const category = categories.value.find((c) => c.id === categoryId)
  if (!category) return

  // Check if any documents are using this category
  const { data: docs, error: docsError } = await supabase
    .from('documents_metadata')
    .select('id, metadata')
    .contains('metadata', { categories: [category.name] })

  if (docsError) {
    console.error('Error checking documents:', docsError)
    return
  }

  if (docs && docs.length > 0) {
    if (
      docs.length === 1 &&
      docs[0].id === route.params.id &&
      !editableCategories.value.includes(category.name)
    ) {
      // Safe to delete
    } else {
      deleteErrorMessage.value = `The category "${category.name}" is still used in ${docs.length} document(s). Please remove it from those documents before deleting.`
      showDeleteErrorDialog.value = true
      return
    }
  }

  // Safe to delete from Supabase
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    return
  }

  // Remove from local categories list
  categories.value = categories.value.filter((c) => c.id !== categoryId)

  // If it was selected for this document, remove it from editableCategories too
  editableCategories.value = editableCategories.value.filter((name) => name !== category.name)
}

onMounted(async () => {
  const { data, error } = await supabase
    .from('documents_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Document not found from Supabase:', error)
    doc.value = documentsStore.documents.find((d) => d.id == route.params.id) || null
    console.log('Fallback Document from Store:', doc.value)
  } else {
    doc.value = {
      ...data,
      bookmarked: false,
      starred: false,
    }

    // Add null/undefined check before mapping
    if (data.related_links && Array.isArray(data.related_links)) {
      links.value = data.related_links.map((link, idx) => ({
        id: link.id || Date.now() + idx,
        title: link.title || '',
        url: link.url || '',
      }))
    } else {
      // Initialize as empty array if no related links exist
      links.value = []
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
  loadCategories(data)
})

// Generate Summary
const generateSummary = async () => {
  showSummaryDialog.value = true
  summaryLoading.value = true

  try {
    const { data } = await axios.post(getNlpEndpoint(`/generate-summary/${docId}`))
    summary.value = data.summary
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to generate summary' })
  } finally {
    summaryLoading.value = false
  }
}

const saveSummary = () => {
  summaryLoading.value = true
  try {
    if (doc.value && doc.value.metadata) {
      doc.value.metadata.summary = summary.value
    }

    $q.notify({ type: 'positive', message: 'Summary updated locally' })
    showSummaryDialog.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to update summary' })
  } finally {
    summaryLoading.value = false
  }
}

// Loading Mini Game
const nextSimonStep = () => {
  const nextColor = colors[Math.floor(Math.random() * colors.length)]
  simonSequence.value.push(nextColor)
  playSequence()
}

const playSequence = async () => {
  for (let c of simonSequence.value) {
    activeColor.value = c
    await new Promise((r) => setTimeout(r, 500))
    activeColor.value = null
    await new Promise((r) => setTimeout(r, 200))
  }
  userSequence.value = []
}

const handleColorClick = (color) => {
  userSequence.value.push(color)
  const currentIndex = userSequence.value.length - 1
  if (userSequence.value[currentIndex] !== simonSequence.value[currentIndex]) {
    // Game over
    simonSequence.value = []
    userSequence.value = []
    simonScore.value = 0
    nextSimonStep()
  } else if (userSequence.value.length === simonSequence.value.length) {
    simonScore.value += 1
    nextSimonStep()
  }
}

watch(
  () => summaryLoading,
  async (val) => {
    if (val) {
      simonSequence.value = []
      userSequence.value = []
      simonScore.value = 0
      await nextTick()
      nextSimonStep()
    } else {
      simonSequence.value = []
      userSequence.value = []
      simonScore.value = 0
    }
  },
)

watch(
  doc,
  (newDocument) => {
    if (newDocument) {
      // Initialize categories
      if (newDocument.metadata?.categories) {
        editableCategories.value = [...newDocument.metadata.categories]
      } else {
        editableCategories.value = []
      }

      // Initialize all editable data
      editableData.value = {
        date: newDocument.metadata?.date,
        title: newDocument.metadata?.title,
        author: newDocument.metadata?.author,
        summary: newDocument.metadata?.summary,
      }
    } else {
      editableCategories.value = []
      editableData.value = {
        date: '',
        title: '',
        author: '',
        summary: '',
        // extracted_text: '',
      }
    }
  },
  { immediate: true },
)

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
    console.log('Using endpoint:', getNlpEndpoint('/related-links'))

    loadingRelatedLinks.value = true

    const endpoint = getNlpEndpoint('/related-links')

    const { data } = await axios.get(endpoint, {
      params: {
        title,
        author,
        categories,
        date,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Received data:', data)

    // Check if data and data.links exist
    if (!data || !data.links) {
      console.warn('No links returned from API')
      links.value = []
      hasChanges.value = false
      return
    }

    // Validate that data.links is an array
    if (!Array.isArray(data.links)) {
      console.error('API returned non-array links:', data.links)
      links.value = []
      hasChanges.value = false
      return
    }

    links.value = data.links.map((link, idx) => ({
      id: Date.now() + idx,
      title: link.title || link.url || 'Untitled',
      url: link.url || '',
    }))

    hasChanges.value = true
    showRelatedDialog.value = true

    console.log('Successfully mapped links:', links.value)
  } catch (err) {
    console.error('Error fetching related links:', err)

    // More detailed error logging
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data)
    } else if (err.request) {
      console.error('No response received:', err.request)
    } else {
      console.error('Request setup error:', err.message)
    }

    // Show user-friendly error
    $q.notify({
      type: 'negative',
      message: 'Failed to fetch related links. Please try again.',
      caption: err.message,
    })

    links.value = []
    hasChanges.value = false
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
  const { data } = await supabase
    .from('documents_metadata')
    .select('related_links')
    .eq('id', route.params.id)
    .single()

  // Add null/undefined check
  if (data && data.related_links && Array.isArray(data.related_links)) {
    links.value = data.related_links.map((link, idx) => ({
      id: link.id || Date.now() + idx,
      title: link.title || '',
      url: link.url || '',
    }))
  } else {
    links.value = []
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

.document-img {
  width: 300px;
  margin-left: 10rem;
  margin-right: 2rem;
  z-index: 1;
  position: relative;
  margin-bottom: -10rem;
  box-shadow: 0 0 20px rgba(102, 102, 102, 0.3);
}

.summary-input :deep(.q-field__native) {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 400 !important;
  font-size: 12px !important;
  color: black !important;
  line-height: 1.4 !important;
  text-align: justify !important;
}

.summary-input :deep(textarea) {
  resize: none !important;
}

.add-category-input {
  max-width: 200px;
}

.space {
  margin-top: 10rem;
}

.author-input {
  width: 17rem;
}

/* Responsivesness */
@media (max-width: 1200px) {
  .document-img {
    display: none;
  }

  .space {
    margin-top: 2rem;
  }

  .tags {
    margin-top: 2rem;
  }
}

@media (max-width: 900px) {
  .description-row {
    margin-right: 1rem;
  }

  .description-section,
  .meta-section {
    flex: 0 0 100%;
  }
}

@media (max-width: 700px) {
  .author-input {
    width: 30rem;
  }
}
</style>
