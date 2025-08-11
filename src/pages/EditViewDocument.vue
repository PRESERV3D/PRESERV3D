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
        <div class="col">
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
              <q-btn
                flat
                no-caps
                dense
                label="Find More Info"
                class="find-more-info-btn"
                @click="findMoreInfo"
              />
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
          <div class="row">
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
            </div>
            <div class="meta-section">
              <div class="font-label">
                <p><strong>Uploaded At:</strong> {{ formatDate(doc.uploaded_at) }}</p>
                <p><strong>Updated At:</strong> {{ formatDate(doc.updated_at) }}</p>
                <p><strong>Date:</strong> {{ doc.metadata.date }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <q-banner type="negative">Document not found.</q-banner>
    </div>
    <ConfirmMetadata
      v-model="dialog"
      :metadata="metadata"
      @confirm="saveMetadata"
      @cancel="handleCancelMetadata"
    />

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
import { useRoute } from 'vue-router'
import { supabase } from 'boot/supabase'
import ConfirmMetadata from 'src/components/ConfirmMetadata.vue'
import { useUserStore } from 'stores/user'
import { useDocumentsStore } from 'stores/documentsStore'

const documentsStore = useDocumentsStore()

const route = useRoute()
const doc = ref(null)
const loading = ref(true)

const dialog = ref(false)
const metadata = ref(null)
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
const newCategory = ref('')
const editableCategories = ref([])
const showCategoryInput = ref(false)

const findMoreInfo = () => {
  // Add your find more info logic here
  console.log('Find More Info clicked')
}

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

.tags {
  margin-top: 10rem;
  font-size: 12px;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-box {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  background-color: rgba(204, 172, 0, 0.7);
  color: #560505;
  padding: 0.3rem 1.5rem;
  border-radius: 5px;
  margin-left: 0.5rem;
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
</style>
