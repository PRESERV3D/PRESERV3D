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

              <!-- Check Summary Relevance Button -->
              <q-btn
                flat
                no-caps
                dense
                label="Check Relevance"
                class="q-ml-md find-more-info-btn"
                style="margin-top: 1rem; font-size: 0.75rem"
                @click="checkSummaryRelevance"
                :disable="!editableData.summary || !editableData.summary.trim()"
              />

              <q-dialog v-model="showSummaryDialog" persistent>
                <q-card style="min-width: 400px; max-width: 600px; position: relative">
                  <q-card-section>
                    <div v-if="summaryLoading" style="text-align: center">
                      <q-spinner color="primary" size="50px" />
                      <div style="margin-top: 10px">Checking summary relevance...</div>
                    </div>

                    <div v-else>
                      <div class="text-h6 q-mb-md">Summary Relevance Check</div>

                      <!-- Success Display -->
                      <div
                        v-if="!relevanceError"
                        class="q-mt-sm q-pa-md"
                        style="
                          background-color: #e8f5e9;
                          border-left: 4px solid #4caf50;
                          border-radius: 4px;
                        "
                      >
                        <div class="text-positive text-weight-medium" style="font-size: 14px">
                          ✓ Summary passed all relevance checks!
                        </div>
                        <div class="text-caption text-grey-8 q-mt-xs">
                          Your summary is well-aligned with the document content.
                        </div>
                      </div>

                      <!-- Relevance Error Display -->
                      <div
                        v-if="relevanceError"
                        class="q-mt-sm q-pa-md"
                        style="
                          background-color: #ffebee;
                          border-left: 4px solid #f44336;
                          border-radius: 4px;
                        "
                      >
                        <div class="text-negative text-weight-medium" style="font-size: 14px">
                          {{ relevanceError.issue }}
                        </div>
                        <div class="text-caption text-grey-8 q-mt-md">
                          <strong>Suggestion:</strong> {{ relevanceError.suggestion }}
                        </div>
                        <div class="text-caption text-grey-7 q-mt-sm">
                          Severity: {{ relevanceError.severity || 'medium' }}
                        </div>
                      </div>
                    </div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" @click="showSummaryDialog = false" />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <div class="q-ma-md link" @click="showRelatedDialog = true">Show Related Links</div>
              <!-- Related Links Dialog -->
              <q-dialog v-model="showRelatedDialog" persistent>
                <q-card class="related-box">
                  <q-card-section class="dialog-header">
                    <div class="sub-font-3" style="font-size: 18px; font-weight: 700">
                      Related Links
                    </div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      Changes will be saved when you save the document
                    </div>
                  </q-card-section>
                  <q-separator />
                  <div v-if="loadingRelatedLinks" class="q-pa-md flex flex-center">
                    <q-spinner color="primary" size="40px" />
                  </div>
                  <div v-else class="links-container">
                    <!-- Links List with Drag and Edit -->
                    <div v-for="(link, index) in links" :key="link.id" class="full-width q-mb-sm">
                      <div v-if="editingLinkIndex === index" class="column q-gutter-sm q-pa-sm">
                        <!-- Edit Mode -->
                        <q-input v-model="editingLink.title" label="Link Title" outlined dense />
                        <q-input v-model="editingLink.url" label="Link URL" outlined dense />
                        <div class="row justify-end q-gutter-sm">
                          <q-btn flat dense label="Cancel" size="sm" @click="cancelEditLink" />
                          <q-btn
                            flat
                            dense
                            label="Save"
                            color="primary"
                            size="sm"
                            @click="saveEditLink(index)"
                          />
                        </div>
                      </div>

                      <div
                        v-else
                        class="link-item draggable-item"
                        draggable="true"
                        @dragstart="dragStart(index)"
                        @dragover.prevent
                        @drop="drop(index)"
                      >
                        <!-- Drag handle -->
                        <q-icon name="drag_indicator" class="drag-handle" size="sm" />

                        <!-- Link icon and title -->
                        <q-icon name="link" size="18px" class="link-icon" />
                        <div class="link-style" @click="openLink(link.url)">
                          {{ link.title || link.url }}
                        </div>
                        <q-space />

                        <!-- Edit button -->
                        <q-btn
                          flat
                          round
                          icon="edit"
                          color="primary"
                          size="sm"
                          @click="startEditLink(index)"
                        />

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
                    </div>

                    <!-- Add New Link -->
                    <div v-if="showAddLinkForm" class="column q-gutter-sm q-pa-sm full-width">
                      <q-input
                        v-model="newLinkTitle"
                        label="Link Title"
                        outlined
                        dense
                        placeholder="Enter link title"
                      />
                      <q-input
                        v-model="newLink"
                        label="Link URL"
                        outlined
                        dense
                        placeholder="Enter link URL"
                        lazy-rules
                        :rules="[
                          (val) =>
                            !val ||
                            /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/.test(val) ||
                            'Enter a valid URL',
                        ]"
                      />
                      <div class="row justify-end q-gutter-sm">
                        <q-btn flat dense label="Cancel" size="sm" @click="cancelAddLink" />
                        <q-btn
                          flat
                          dense
                          label="Add"
                          color="primary"
                          size="sm"
                          @click="addLink"
                          :disable="!newLink.trim() || !newLinkTitle.trim()"
                        />
                      </div>
                    </div>

                    <!-- Add Link Button -->
                    <q-btn
                      v-if="!showAddLinkForm"
                      flat
                      dense
                      icon="add"
                      label="Add New Link"
                      class="q-mt-sm"
                      @click="showAddLinkForm = true"
                      @keyup.up="showAddLinkForm = true"
                    />
                  </div>

                  <!-- Save and Cancel Actions -->
                  <q-card-actions align="right">
                    <template v-if="hasChanges">
                      <q-btn
                        flat
                        label="Cancel"
                        class="sub-font-2"
                        style="color: #000000"
                        v-close-popup
                        no-caps
                        @click="cancelLinksChanges()"
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
                            editableCategories.join(','),
                            doc.metadata.date.slice(0, 4),
                          )
                        "
                      />
                      <q-btn label="Close" class="btn-save" flat v-close-popup />
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
                            editableCategories.join(','),
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
import { ref, onMounted, computed, watch } from 'vue'
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

const userRole = computed(() => userStore.profile?.role ?? null)
const isAdmin = computed(() => userRole.value === 'admin')

const dialogOpen = ref(false)

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

// Check Summary Relevance
const $q = useQuasar()
const showSummaryDialog = ref(false)
const relevanceError = ref(null)

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
      related_links: links.value.map((link) => ({
        title: link.title || '',
        url: link.url || '',
      })),
    }

    let changes = getChanges(oldData, newData)

    if (Object.keys(changes).length === 0 && hasChanges.value === false) {
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
  try {
    // Parallelize document fetch, categories fetch, and auth check
    const [documentResult, categoriesResult, authResult] = await Promise.all([
      supabase.from('documents_metadata').select('*').eq('id', route.params.id).single(),
      supabase.from('categories').select('id, type, category'),
      supabase.auth.getUser(),
    ])

    const { data, error } = documentResult
    const { data: categoriesData, error: categoriesError } = categoriesResult
    const { data: authData } = authResult
    const userId = authData?.user?.id

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

      // Process related links
      if (data.related_links && Array.isArray(data.related_links)) {
        links.value = data.related_links.map((link, idx) => ({
          id: link.id || Date.now() + idx,
          title: link.title || '',
          url: link.url || '',
        }))
      } else {
        links.value = []
      }
    }

    // Process categories
    if (!categoriesError && categoriesData) {
      const docCategories = data?.metadata?.categories || []
      categories.value = categoriesData
        .filter((c) => c.type === 'document')
        .map((c) => ({
          id: c.id,
          name: c.category,
          selected: docCategories.includes(c.category),
        }))
    } else {
      console.error('Error loading categories:', categoriesError)
      categories.value = []
    }

    // Check favorites if user is logged in
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

    // Parallelize star and view counts fetching
    await Promise.all([documentsStore.fetchStarCounts(), documentsStore.fetchViewCounts()])
  } catch (err) {
    console.error('Unexpected error loading document:', err)
    doc.value = documentsStore.documents.find((d) => d.id == route.params.id) || null
  } finally {
    loading.value = false
  }
})

// Check Summary Relevance
const checkSummaryRelevance = async () => {
  if (!editableData.value.summary || !editableData.value.summary.trim()) {
    $q.notify({ type: 'warning', message: 'Please enter a summary first' })
    return
  }

  showSummaryDialog.value = true
  summaryLoading.value = true
  relevanceError.value = null

  try {
    // Call backend to check relevance of current summary
    const endpoint = getNlpEndpoint('/check-relevance')
    const { data } = await axios.post(endpoint, {
      title: editableData.value.title,
      summary: editableData.value.summary,
      keywords: [], // Don't check keywords in manual check
      categories: editableData.value.categories,
      author: editableData.value.author,
      date: editableData.value.date,
      extracted_text: doc.value?.metadata?.extracted_text?.substring(0, 1000),
    })

    if (data.passed) {
      relevanceError.value = null
    } else {
      relevanceError.value = {
        issue: data.issue,
        suggestion: data.suggestion,
        severity: data.severity,
      }
    }
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.issue || 'Failed to check relevance',
    })
  } finally {
    summaryLoading.value = false
  }
}

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
const newLinkTitle = ref('')
const showAddLinkForm = ref(false)
const links = ref([])
const hasChanges = ref(false)
const loadingRelatedLinks = ref(false)
let draggedIndex = null

// Edit link state
const editingLinkIndex = ref(null)
const editingLink = ref({ title: '', url: '' })

function startEditLink(index) {
  editingLinkIndex.value = index
  editingLink.value = {
    title: links.value[index].title || '',
    url: links.value[index].url || '',
  }
}

function saveEditLink(index) {
  if (editingLink.value.title.trim() && editingLink.value.url.trim()) {
    links.value[index] = {
      ...links.value[index],
      title: editingLink.value.title.trim(),
      url: editingLink.value.url.trim(),
    }
    hasChanges.value = true
    cancelEditLink()
  }
}

function cancelEditLink() {
  editingLinkIndex.value = null
  editingLink.value = { title: '', url: '' }
}

async function fetchRelatedLinks(title, author, categories, date) {
  try {
    console.log('Fetching related links for:', title, author, categories, date)
    loadingRelatedLinks.value = true

    const endpoint = getNlpEndpoint('/related-links')

    const { data } = await axios.get(endpoint, {
      params: { title, author, categories, date },
      headers: { 'Content-Type': 'application/json' },
    })

    if (!data || !data.links || !Array.isArray(data.links)) {
      console.warn('No valid links returned from API')
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
  } catch (err) {
    console.error('Error fetching related links:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to fetch related links. Please try again.',
    })
    links.value = []
    hasChanges.value = false
  } finally {
    loadingRelatedLinks.value = false
  }
}

function addLink() {
  if (newLink.value.trim() && newLinkTitle.value.trim()) {
    links.value.push({
      id: Date.now(),
      title: newLinkTitle.value.trim(),
      url: newLink.value.trim(),
    })
    newLink.value = ''
    newLinkTitle.value = ''
    showAddLinkForm.value = false
    hasChanges.value = true
  }
}

function cancelAddLink() {
  newLink.value = ''
  newLinkTitle.value = ''
  showAddLinkForm.value = false
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

function cancelLinksChanges() {
  // Reset links to the current document state
  if (doc.value && doc.value.related_links && Array.isArray(doc.value.related_links)) {
    links.value = doc.value.related_links.map((link, idx) => ({
      id: link.id || Date.now() + idx,
      title: link.title || '',
      url: link.url || '',
    }))
  } else {
    links.value = []
  }

  hasChanges.value = false
  showRelatedDialog.value = false
  showAddLinkForm.value = false
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

/* Related Links Dialog */
.related-box {
  min-width: 500px;
  max-width: 600px;
  border-radius: 15px;
  font-family: 'Poppins', sans-serif;
  background-color: #fbf4d0;
}

.dialog-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e0dbc7;
}

.links-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.link-item:hover {
  background-color: #f5f5f5;
}

.drag-handle {
  color: #999;
  cursor: move;
  flex-shrink: 0;
}

.link-icon {
  color: #880000;
  flex-shrink: 0;
}

.link-style {
  cursor: pointer;
  color: #880000;
  text-decoration: none;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-item:hover .link-style {
  text-decoration: underline;
  color: #560505;
}

.draggable-item {
  transition: background-color 0.2s;
}

.draggable-item:hover {
  background-color: #f5f5f5;
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
